#!/usr/bin/env python3
import base64, json, os, re, urllib.request
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'data/projects.json').read_text(encoding='utf-8'))
OWNER = CONFIG['owner']; EXCLUDE = set(CONFIG.get('exclude', [])); OUT = ROOT / CONFIG.get('generated', 'data/projects.generated.json'); TOKEN = os.getenv('GITHUB_TOKEN', '')
PRIVATE_SNAPSHOT = ROOT / 'data/private-projects.json'
HEADERS={'Accept':'application/vnd.github+json','User-Agent':'jorgebandeo-portfolio-compiler'}
if TOKEN: HEADERS['Authorization']=f'Bearer {TOKEN}'
ALIASES={'APP-Clinica':'Gerenciador de Consultas Médicas','PSE':'Projetos de Sistemas Embarcados — PSE','STR':'Sistemas em Tempo Real','LFA':'Linguagens Formais e Autômatos','micro-M2':'Biblioteca de Memória Serial','Kernel-Filter':'Análise Comparativa de Filtros Adaptativos','Processamento-Digital-de-Sinais':'Processamento Digital de Sinais','Dataset_FallProject':'Dataset para Detecção de Quedas','YOLOv8Train':'Treinamento YOLOv8 para Detecção de Quedas','Site-Casamento':'Site de Casamento','site-musica':'Experiência Web com Áudio','Eletr-nica-Aplicada-':'Eletrônica Aplicada','Materia-RedCop':'Redes de Computadores','Materia-I-A-Py':'Inteligência Artificial em Python','Mataria-de-IA':'Estudos de Inteligência Artificial','Sistemas-Operacionais':'Escalonadores de Sistemas Operacionais','Repositorio-Univali':'Projetos Acadêmicos de Engenharia de Computação'}
TECH_PATTERNS={'ESP32':r'\besp32\b','Arduino':r'\barduino\b','OpenCV':r'\bopencv\b','YOLO':r'\byolo\w*\b','TensorFlow':r'\btensorflow\b','PyTorch':r'\bpytorch\b','Android':r'android studio|\bandroid\b','Bluetooth':r'\bbluetooth\b','MQTT':r'\bmqtt\b','DHT11':r'\bdht11\b','Kalman':r'\bkalman\b','LMS':r'\blms\b','FFT':r'\bfft\b','DSP':r'processamento digital de sinais|\bdsp\b'}
IGNORED_ACTIVITY_PATHS={'portfolio.json'}
MAX_ACTIVITY_COMMITS=40
MAX_BRANCHES=100

def api(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=30) as r:return json.load(r)

def try_api(url):
    try:return api(url)
    except Exception:return None

def read_readme(repo):
    data=try_api(f'https://api.github.com/repos/{OWNER}/{repo}/readme')
    if not data:return ''
    try:return base64.b64decode(data.get('content','')).decode('utf-8',errors='ignore')
    except Exception:return ''

def read_manifest(repo,branch):
    data=try_api(f'https://api.github.com/repos/{OWNER}/{repo}/contents/portfolio.json?ref={quote(branch,safe="")}')
    if not data:return None
    try:return json.loads(base64.b64decode(data['content']).decode('utf-8'))
    except Exception:return None

def read_private_snapshot():
    if not PRIVATE_SNAPSHOT.exists():return []
    try:
        data=json.loads(PRIVATE_SNAPSHOT.read_text(encoding='utf-8'))
        projects=data.get('projects',[])
        # Defesa adicional: projetos privados publicados nunca carregam links externos/repositório.
        for project in projects:
            project['links']={}
            project.setdefault('portfolio',{})['private']=True
            project.setdefault('_repository',{})['visibility']='private'
        return projects
    except Exception:return []

def languages(repo):return list((try_api(f'https://api.github.com/repos/{OWNER}/{repo}/languages') or {}).keys())

def categories(name,description,readme,langs):
    text=' '.join([name,description or '',readme[:6000],' '.join(langs)]).lower();cats=[]
    if any(x in text for x in ['html','css','javascript','php','web','site']):cats.append('web')
    if any(x in text for x in ['android','kotlin','flutter','mobile']):cats.append('mobile')
    if any(x in text for x in ['yolo','opencv','tensorflow','pytorch','inteligência artificial','inteligencia artificial','machine learning','deep learning']):cats.append('ai')
    if any(x in text for x in ['esp32','arduino','embedded','embarcado','microcontrolador','eletrônica','eletronica','hardware','sensor','relay','relé']):cats.append('hardware')
    if any(x in text for x in ['sistema','algoritmo','software','java','python',' c ','c++','scheduler','filtro','grafo','autômato','automato']):cats.append('software')
    return list(dict.fromkeys(cats or ['software']))

def infer_summary(repo,desc,readme):
    if desc:return desc.strip().rstrip('.')+'.'
    txt=re.sub(r'<[^>]+>',' ',readme);txt=re.sub(r'[#>*_`\[\]()!-]+',' ',txt);txt=re.sub(r'\s+',' ',txt).strip()
    for s in re.split(r'(?<=[.!?])\s+',txt):
        if len(s)>=45:return s[:360]
    return f'Repositório público de desenvolvimento e estudos: {repo}.'

def commit_date(commit):
    meta=(commit or {}).get('commit') or {}
    return ((meta.get('committer') or {}).get('date') or (meta.get('author') or {}).get('date') or '')

def parse_iso(value):return value or ''

def list_branches(repo_name, default_branch):
    repo_q=quote(repo_name,safe='');branches=try_api(f'https://api.github.com/repos/{OWNER}/{repo_q}/branches?per_page={MAX_BRANCHES}');names=[]
    if isinstance(branches,list):names=[b.get('name') for b in branches if b.get('name')]
    if default_branch and default_branch not in names:names.insert(0,default_branch)
    return names or [default_branch]

def latest_meaningful_on_branch(repo_name, branch):
    repo_q=quote(repo_name,safe='');branch_q=quote(branch,safe='');commits=try_api(f'https://api.github.com/repos/{OWNER}/{repo_q}/commits?sha={branch_q}&per_page={MAX_ACTIVITY_COMMITS}')
    if not isinstance(commits,list):return None
    ignored=0
    for commit in commits:
        sha=commit.get('sha') or ''
        if not sha:continue
        detail=try_api(f'https://api.github.com/repos/{OWNER}/{repo_q}/commits/{sha}')
        if not detail:continue
        paths={item.get('filename','') for item in (detail.get('files') or []) if item.get('filename')}
        if paths == IGNORED_ACTIVITY_PATHS:ignored+=1;continue
        if not paths:continue
        return {'date':commit_date(detail) or commit_date(commit),'sha':sha,'branch':branch,'ignoredManifestOnlyCommits':ignored}
    return None

def meaningful_last_update(repo, fallback=''):
    branches=list_branches(repo['name'],repo['default_branch']);candidates=[];ignored_total=0
    for branch in branches:
        candidate=latest_meaningful_on_branch(repo['name'],branch)
        if candidate:ignored_total+=candidate.get('ignoredManifestOnlyCommits',0);candidates.append(candidate)
    if candidates:
        best=max(candidates,key=lambda x:parse_iso(x.get('date')))
        return {'date':best.get('date') or fallback,'sha':best.get('sha',''),'branch':best.get('branch',repo['default_branch']),'branchesChecked':branches,'ignoredManifestOnlyCommits':ignored_total,'source':'latest-non-portfolio-only-commit-across-branches'}
    return {'date':fallback,'sha':'','branch':repo['default_branch'],'branchesChecked':branches,'ignoredManifestOnlyCommits':ignored_total,'source':'repository-pushed-at-fallback'}

def repository_metadata(repo, manifest=None):
    created=repo.get('created_at') or '';pushed=repo.get('pushed_at') or '';updated=repo.get('updated_at') or '';explicit_project_date=((manifest or {}).get('project') or {}).get('date');project_date=explicit_project_date or (created[:10] if created else '');meaningful=meaningful_last_update(repo,pushed or updated)
    return {'createdAt':created,'pushedAt':pushed,'updatedAt':updated,'lastActivityAt':meaningful['date'],'lastActivitySha':meaningful['sha'],'lastActivityBranch':meaningful['branch'],'lastActivitySource':meaningful['source'],'branchesChecked':meaningful['branchesChecked'],'ignoredManifestOnlyCommits':meaningful['ignoredManifestOnlyCommits'],'projectDate':project_date,'projectDateSource':'manifest' if explicit_project_date else 'repository-created-at','visibility':'public'}

def compile_repo(repo):
    name=repo['name'];branch=repo['default_branch'];manifest=read_manifest(name,branch)
    if manifest:
        if manifest.get('portfolio',{}).get('visible',True) is False:return None
        manifest['_source']={'owner':OWNER,'repo':name,'ref':branch,'mode':'manifest'};manifest['_repository']=repository_metadata(repo,manifest);return manifest
    readme=read_readme(name);langs=languages(name);desc=repo.get('description') or '';text=' '.join([desc,readme[:8000]]).lower();tech=langs[:6]
    for label,pattern in TECH_PATTERNS.items():
        if re.search(pattern,text,re.I) and label not in tech:tech.append(label)
    if not tech:tech=['GitHub']
    cats=categories(name,desc,readme,langs);title=ALIASES.get(name,name.replace('-',' ').replace('_',' ').strip());summary=infer_summary(name,desc,readme);status='empty' if repo.get('size',0)==0 else 'repository';project_date=(repo.get('created_at') or '')[:10]
    return {'schemaVersion':1,'project':{'id':re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-'),'name':title,'subtitle':summary[:150],'date':project_date,'status':status},'categories':cats,'technologies':tech[:8],'summary':summary,'development':[],'highlights':[f'Linguagens detectadas: {", ".join(langs)}'] if langs else [],'media':{'gallery':[]},'links':{'repository':repo['html_url']},'portfolio':{'visible':True,'featured':False,'order':500,'private':False},'_source':{'owner':OWNER,'repo':name,'ref':branch,'mode':'auto'},'_repository':repository_metadata(repo)}

def main():
    # O endpoint público continua sendo a fonte dos repositórios públicos.
    # Projetos privados entram somente pelo snapshot sanitizado versionado no Portfolio.
    repos=api(f'https://api.github.com/users/{OWNER}/repos?per_page=100&type=owner&sort=updated')
    repos=[r for r in repos if not r.get('private') and r['name'] not in EXCLUDE]
    projects=[p for p in (compile_repo(r) for r in repos) if p is not None]
    private_projects=read_private_snapshot()
    projects.extend(private_projects)
    projects.sort(key=lambda p:(p.get('portfolio',{}).get('order',500),p['project']['name'].lower()))
    payload={'version':2,'owner':OWNER,'count':len(projects),'publicCount':len(projects)-len(private_projects),'privateCount':len(private_projects),'projects':projects}
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Compiled {len(projects)} projects ({len(private_projects)} private snapshots) -> {OUT}')

if __name__=='__main__':main()
