package main

import (
	"encoding/json"
	"flag"
	"math"
	"os"
	"sort"
	"strings"
)

type Event struct {
	EventID string `json:"event_id"`
	Title string `json:"title"`
	StartedAt string `json:"started_at"`
	Features []string `json:"features"`
	Completeness float64 `json:"completeness"`
}

type Edge struct { A string `json:"a"`; B string `json:"b"`; Similarity float64 `json:"similarity"` }
type Cluster struct { ID int `json:"id"`; Events []string `json:"events"`; Features []string `json:"features"` }
type Gap struct { Feature string `json:"feature"`; Count int `json:"count"` }
type Report struct { Events []Event `json:"events"`; Edges []Edge `json:"edges"`; Clusters []Cluster `json:"clusters"`; Gaps []Gap `json:"gaps"` }

func jaccard(a, b []string) float64 {
	as := map[string]bool{}; bs := map[string]bool{}
	for _, x := range a { as[strings.ToLower(x)] = true }; for _, x := range b { bs[strings.ToLower(x)] = true }
	if len(as)==0 && len(bs)==0 { return 0 }
	n := 0; for x := range as { if bs[x] { n++ } }
	u := len(as)+len(bs)-n; if u==0 { return 0 }; return float64(n)/float64(u)
}

func main() {
	in := flag.String("in", "web/data/visualization.json", "normalized JSON")
	out := flag.String("out", "web/data/semantic.json", "analysis JSON")
	threshold := flag.Float64("threshold", 0.25, "minimum similarity edge")
	flag.Parse()
	f, err := os.Open(*in); if err != nil { panic(err) }; defer f.Close()
	var events []Event
	if err := json.NewDecoder(f).Decode(&events); err != nil { panic(err) }
	rep := Report{Events: events}
	adj := make([][]int, len(events))
	for i:=0;i<len(events);i++ { for j:=i+1;j<len(events);j++ { s:=jaccard(events[i].Features,events[j].Features); if s>=*threshold { rep.Edges=append(rep.Edges,Edge{events[i].EventID,events[j].EventID,math.Round(s*100)/100}); adj[i]=append(adj[i],j); adj[j]=append(adj[j],i) } } }
	seen:=make([]bool,len(events)); cid:=0
	for i:=range events { if seen[i] { continue }; q:=[]int{i}; seen[i]=true; ids:=[]string{}; fs:=map[string]bool{}
		for len(q)>0 { x:=q[0]; q=q[1:]; ids=append(ids,events[x].EventID); for _,f:=range events[x].Features { fs[f]=true }; for _,y:=range adj[x] { if !seen[y] { seen[y]=true; q=append(q,y) } } }
		features:=[]string{}; for f:=range fs { features=append(features,f) }; sort.Strings(features); sort.Strings(ids); rep.Clusters=append(rep.Clusters,Cluster{cid,ids,features}); cid++
	}
	counts:=map[string]int{}; for _,e:=range events { for _,f:=range e.Features { counts[f]++ } }
	for f,c:=range counts { if c==1 { rep.Gaps=append(rep.Gaps,Gap{f,c}) } }; sort.Slice(rep.Gaps,func(i,j int)bool{return rep.Gaps[i].Feature<rep.Gaps[j].Feature})
	b,_:=json.MarshalIndent(rep,"","  "); if err:=os.WriteFile(*out,append(b,'\n'),0644);err!=nil{panic(err)}
}
