"""One-time Nugen setup for ResortOS.
Requires NUGEN_API_KEY in .env. Uploads the ResortOS domain corpus, creates the
Nugen alignment project, waits for completion, then writes NUGEN_ALIGNMENT_ID
and NUGEN_MODEL_ID into .env for live inference.
"""
import os, time
from pathlib import Path
import requests
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass
BASE='https://api.nugen.in/api/v3'
KEY=os.getenv('NUGEN_API_KEY')
if not KEY:
    raise SystemExit('NUGEN_API_KEY is missing. Add it to .env first.')
H={'Authorization':f'Bearer {KEY}'}
root=Path(__file__).parent
corpus=root/'nugen_domain_corpus.txt'
print('1/3 Uploading ResortOS domain corpus...')
with corpus.open('rb') as f:
    r=requests.post(BASE+'/documents/create',headers=H,data={'categories':'hospitality,digital-twin,weather','names':corpus.name},files={'files.items':(corpus.name,f,'text/plain')},timeout=60)
r.raise_for_status(); ids=r.json().get('document_ids',[])
print('Documents:',ids)
print('2/3 Waiting for document processing...')
for did in ids:
    for _ in range(60):
        s=requests.get(BASE+f'/documents/{did}/status',headers=H,timeout=30); s.raise_for_status(); st=s.json(); status=str(st.get('status','')).upper(); print(' ',did,status)
        if status in ('READY','COMPLETED'): break
        if status in ('FAILED','ERROR'): raise SystemExit(f'Document processing failed: {st}')
        time.sleep(5)
print('3/3 Creating Nugen domain alignment...')
payload={'alignment_name':'ResortOS Hospitality Weather Digital Twin','base_model_id':os.getenv('NUGEN_BASE_MODEL','nugen-flash-instruct'),'document_ids':ids,'description':'Domain alignment for ResortOS hospitality operations and weather-driven Digital Twin simulation.'}
r=requests.post(BASE+'/alignment-projects/create',headers={**H,'Content-Type':'application/json'},json=payload,timeout=60); r.raise_for_status(); created=r.json(); aid=created['alignment_id']; print('Alignment:',aid)
for _ in range(240):
    r=requests.get(BASE+f'/alignment-projects/{aid}/status',headers=H,timeout=30); r.raise_for_status(); st=r.json(); status=str(st.get('status','')).upper(); print(' ',status)
    if status in ('COMPLETED','READY','SUCCEEDED'):
        model=st.get('model_id') or st.get('aligned_model_id')
        if not model and isinstance(st.get('model'),dict): model=st['model'].get('id')
        if not model: raise SystemExit(f'Alignment completed but no model_id was returned: {st}')
        env=root/'.env'
        text=env.read_text() if env.exists() else ''
        lines=[]
        for line in text.splitlines():
            if line.startswith('NUGEN_ALIGNMENT_ID=') or line.startswith('NUGEN_MODEL_ID='): continue
            lines.append(line)
        lines += [f'NUGEN_ALIGNMENT_ID={aid}',f'NUGEN_MODEL_ID={model}']
        env.write_text('\n'.join(lines)+'\n')
        print('\nDONE. .env updated with aligned model:',model)
        break
    if status in ('FAILED','ERROR','CANCELLED'): raise SystemExit(f'Alignment failed: {st}')
    time.sleep(10)
else:
    raise SystemExit('Timed out waiting for alignment. Keep NUGEN_ALIGNMENT_ID in .env and run again/check status later.')
