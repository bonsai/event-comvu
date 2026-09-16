package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"sort"
	"strings"
)

const expectedCount = 176

type Event struct {
	EventID    string   `json:"event_id"`
	StartedAt  string   `json:"started_at"`
	Organizer  string   `json:"organizer"`
	Venue      string   `json:"venue"`
	Online     *bool    `json:"online"`
	SourceURL  string   `json:"source_url"`
	Technology []string `json:"technology"`
	Theme      []string `json:"theme"`
	Community  []string `json:"community"`
	Features   []string `json:"features"`
	Format     string   `json:"format"`
	Completeness float64 `json:"completeness"`
}

type Count struct { Key string `json:"key"`; Count int `json:"count"` }
type Statistics struct {
	ExpectedCount int `json:"expected_count"`
	ActualCount int `json:"actual_count"`
	PopulationGate string `json:"population_gate"`
	Years []Count `json:"years"`
	Months []Count `json:"months"`
	Organizers []Count `json:"organizers"`
	Venues []Count `json:"venues"`
	Formats []Count `json:"formats"`
	Tags []Count `json:"tags"`
	SourceURLCoverage float64 `json:"source_url_coverage"`
	MetadataCompleteness float64 `json:"metadata_completeness"`
}

func add(m map[string]int, key string) { if strings.TrimSpace(key) != "" { m[key]++ } }
func counts(m map[string]int) []Count { out:=make([]Count,0,len(m)); for k,v:=range m { out=append(out,Count{k,v}) }; sort.Slice(out,func(i,j int)bool{if out[i].Count==out[j].Count{return out[i].Key<out[j].Key};return out[i].Count>out[j].Count}); return out }
func addList(m map[string]int, xs []string) { for _,x:=range xs { add(m,x) } }

func main() {
	in:=flag.String("in","data/connpass/vonsai.jsonl","input JSONL")
	out:=flag.String("out","analysis/statistics.json","output JSON")
	flag.Parse()
	f,err:=os.Open(*in); if err!=nil { panic(err) }; defer f.Close()
	var events []Event
	s:=bufio.NewScanner(f); s.Buffer(make([]byte,1024),1024*1024)
	for s.Scan(){var e Event; if json.Unmarshal(s.Bytes(),&e)==nil {events=append(events,e)}}
	if err:=s.Err();err!=nil{panic(err)}
	actual:=len(events)
	if actual!=expectedCount { panic(fmt.Sprintf("POPULATION_GATE_FAILED: expected=%d actual=%d",expectedCount,actual)) }
	years,months,orgs,venues,formats,tags:=map[string]int{},map[string]int{},map[string]int{},map[string]int{},map[string]int{},map[string]int{}
	validURLs:=0; completeness:=0.0
	for _,e:=range events {
		if e.SourceURL!="" {validURLs++}
		if len(e.StartedAt)>=4 {add(years,e.StartedAt[:4])}
		if len(e.StartedAt)>=7 {add(months,e.StartedAt[:7])}
		add(orgs,e.Organizer); add(venues,e.Venue); add(formats,e.Format)
		addList(tags,e.Technology); addList(tags,e.Theme); addList(tags,e.Features)
		completeness+=e.Completeness
	}
	rep:=Statistics{ExpectedCount:expectedCount,ActualCount:actual,PopulationGate:"PASS",Years:counts(years),Months:counts(months),Organizers:counts(orgs),Venues:counts(venues),Formats:counts(formats),Tags:counts(tags),SourceURLCoverage:float64(validURLs)/float64(actual),MetadataCompleteness:completeness/float64(actual)}
	b,_:=json.MarshalIndent(rep,"","  "); if err:=os.MkdirAll("analysis",0755);err!=nil{panic(err)}; if err:=os.WriteFile(*out,append(b,'\n'),0644);err!=nil{panic(err)}
	fmt.Printf("POPULATION_GATE_OK: %d/%d\nSTATISTICS_OK: %s\n",actual,expectedCount,*out)
}
