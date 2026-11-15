"""Step 1: download the official PSI combustion records (metadata + file trees).

Run:  python3 tools/fetch_psi.py data/raw      (needs curl; anonymous public API, about 60 MB)
Source: https://psi.nasa.gov/physci/repo/search?q=combustion
"""
import json,subprocess,sys,time,os,urllib.parse
OUT=sys.argv[1] if len(sys.argv) > 1 else "data/raw"; os.makedirs(OUT + "/investigations", exist_ok=True); B='https://psi.nasa.gov/geode-py/ws'
def curl(url,post=None):
    c=['curl','-s','--max-time','120','-A','Mozilla/5.0','-w','\n%{http_code}',url]
    if post is not None: c+=['-X','POST','-H','Content-Type: application/json','-d',json.dumps(post)]
    r=subprocess.run(c,capture_output=True,text=True).stdout
    body,_,code=r.rpartition('\n'); time.sleep(0.7)
    return int(code or 0),body
pages=[];hits=[]
for name,q in [('term','term=combustion'),('filter','term=&ffield=Research%20Area&fvalue=combustion%20science')]:
    frm=0
    while True:
        u=f'{B}/repo/search?{q}&from={frm}&size=25'
        code,b=curl(u); d=json.loads(b); pages.append({'query':name,'url':u,'status':code,'response':d})
        hh=d['hits']['hits']; hits+=hh; frm+=25
        if frm>=d['hits']['total'] or not hh: break
json.dump({'note':'query=term is the site search for "combustion"; query=filter is the Research Area=combustion science facet','pages':pages},open(f'{OUT}/psi_combustion_search.json','w'),indent=1)
ids=sorted({h['_source']['Accession'] for h in hits if h['_index']=='investigation'},key=lambda s:int(s.split('-')[1]))
print(len(ids),ids)
fails=[]
for i in ids:
    mu=f'{B}/repo/investigations/{i}'
    code,b=curl(mu)
    try: meta=json.loads(b)
    except Exception as e: fails.append((i,'meta',code)); continue
    fp={"folder":"genelab-data/","fileType":"study","studyId":i,"version":meta.get('version')}
    fcode,fb=curl(f'{B}/files/v2',fp)
    try: files=json.loads(fb)
    except Exception: files=None; fails.append((i,'files',fcode))
    json.dump({'_source':{'metadata_url':mu,'metadata_status':code,'files_url':f'{B}/files/v2','files_post_body':fp,'files_status':fcode},'metadata':meta,'files':files},open(f'{OUT}/investigations/{i}.json','w'),indent=1)
    print(i,code,fcode,len(b),len(fb),flush=True)
print('FAILS',fails)
