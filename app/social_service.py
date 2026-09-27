import requests, urllib.parse

def get_social_signals(query="Mumbai resort rain flood travel", limit=8):
    url="https://www.reddit.com/search.json"
    params={"q":query,"sort":"new","limit":limit,"t":"day"}
    headers={"User-Agent":"ResortOS-DigitalTwin/1.0 (hospitality hackathon prototype)"}
    try:
        r=requests.get(url,params=params,headers=headers,timeout=10); r.raise_for_status(); data=r.json()
        out=[]
        for c in data.get("data",{}).get("children",[]):
            p=c.get("data",{})
            out.append({"title":p.get("title",""),"subreddit":p.get("subreddit",""),"score":p.get("score",0),"created":p.get("created_utc")})
        return {"source":"Reddit public search","query":query,"items":out,"count":len(out)}
    except Exception as e:
        return {"source":"Reddit public search","query":query,"items":[],"count":0,"error":str(e)}
