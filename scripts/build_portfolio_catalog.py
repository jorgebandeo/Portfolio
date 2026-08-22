#!/usr/bin/env python3
import base64, json, os, re, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'data/projects.json').read_text(encoding='utf-8'))
OWNER = CONFIG['owner']; EXCLUDE = set(CONFIG.get('exclude', [])); OUT = ROOT / CONFIG.get('generated', 'data/projects.generated.json'); TOKEN = os.getenv('GITHUB_TOKEN', '')
HEADERS={'Accept':'application/vnd.github+json','User-Agent':'jorgebandeo-portfolio-compiler'}
if TOKEN: HEADERS['Authorization']=f'Bearer {TOKEN}'
ALIASES={'APP-Clinica':'Gerenciador de Consultas Médicas','PSE':'Projetos de Sistemas Embarcados — PSE','STR':'Sistemas em Tempo Real','LFA':'Linguagens Formais e Autômatos','micro-M2':'Biblioteca de Memória Serial','Kernel-Filter':'Análise Comparativa de Filtros Adaptativos','Processamento-Digital-de-Sinais':'Processamento Digital de Sinais','Dataset_FallProject':'Dataset para Detecção de Quedas','YOLOv8Train':'Treinamento YOLOv8 para Detecção de Quedas','Site-Casamento':'Site de Casamento','site-musica':'Experiência Web com Áudio','Eletr-nica-Aplicada-':'Eletrônica Aplicada','Materia-RedCop':'Redes de Computadores','Materia-I-A-Py':'Inteligência Artificial em Python','Mataria-de-IA':'Estudos de Inteligência Artificial','Sistemas-Operacionais':'Escalonadores de Sistemas Operacionais','Repositorio-Univali':'Projetos Acadêmicos de Engenharia de Computação'}
TECH_PATTERNS={'ESP32':r'\besp32\b','Arduino':r'\barduino\b','OpenCV':r'\bopencv\b','YOLO':r'\byolo\w*\b','TensorFlow':r'\btensorflow\b','PyTorch':r'\bpytorch\b','Android':r'android studio|\bandroid\b','Bluetooth':r'\bbluetooth\b','MQTT':r'\bmqtt\b','DHT11':r'\bdht11\b','Kalman':r'\bkalman\b','LMS':r'\blms\b','FFT':r'\bfft\b','DSP':r'processamento digital de sinais|\bdsp\b'}

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
    data=try_api(f'https://api.github.com/repos/{OWNER}/{repo}/contents/portfolio.json?ref={branch}')
    if not data:return None
    try:return json.loads(base64.b64decode(data['content']).decode('utf-8'))
    except Exception:return None

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

def repository_metadata(repo, manifest=None):
    created = repo.get('created_at') or ''
    pushed = repo.get('pushed_at') or ''
    updated = repo.get('updated_at') or ''
    explicit_project_date = ((manifest or {}).get('project') or {}).get('date')
    project_date = explicit_project_date or (created[:10] if created else '')
    return {
        'createdAt': created,
        'pushedAt': pushed,
        'updatedAt': updated,
        'lastActivityAt': pushed or updated,
        'projectDate': project_date,
        'projectDateSource': 'manifest' if explicit_project_date else 'repository-created-at'
    }

def compile_repo(repo):
    name=repo['name'];branch=repo['default_branch'];manifest=read_manifest(name,branch)
    if manifest:
        if manifest.get('portfolio',{}).get('visible',True) is False:return None
        manifest['_source']={'owner':OWNER,'repo':name,'ref':branch,'mode':'manifest'}
        manifest['_repository']=repository_metadata(repo,manifest)
        return manifest
    readme=read_readme(name);langs=languages(name);desc=repo.get('description') or '';text=' '.join([desc,readme[:8000]]).lower();tech=langs[:6]
    for label,pattern in TECH_PATTERNS.items():
        if re.search(pattern,text,re.I) and label not in tech:tech.append(label)
    if not tech:tech=['GitHub']
    cats=categories(name,desc,readme,langs);title=ALIASES.get(name,name.replace('-',' ').replace('_',' ').strip());summary=infer_summary(name,desc,readme);status='empty' if repo.get('size',0)==0 else 'repository'
    project_date=(repo.get('created_at') or '')[:10]
    return {'schemaVersion':1,'project':{'id':re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-'),'name':title,'subtitle':summary[:150],'date':project_date,'status':status},'categories':cats,'technologies':tech[:8],'summary':summary,'development':[],'highlights':[f'Linguagens detectadas: {", ".join(langs)}'] if langs else [],'media':{'gallery':[]},'links':{'repository':repo['html_url']},'portfolio':{'visible':True,'featured':False,'order':500},'_source':{'owner':OWNER,'repo':name,'ref':branch,'mode':'auto'},'_repository':repository_metadata(repo)}

def main():
    repos=api(f'https://api.github.com/users/{OWNER}/repos?per_page=100&type=owner&sort=updated');repos=[r for r in repos if not r.get('private') and r['name'] not in EXCLUDE];projects=[p for p in (compile_repo(r) for r in repos) if p is not None];projects.sort(key=lambda p:(p.get('portfolio',{}).get('order',500),p['project']['name'].lower()));payload={'version':2,'owner':OWNER,'count':len(projects),'projects':projects};OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(f'Compiled {len(projects)} projects -> {OUT}')

if __name__=='__main__':main()
