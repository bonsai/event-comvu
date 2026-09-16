package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"
)

type Event struct {
	PersonID string `json:"person_id,omitempty"`
	EventID string `json:"event_id"`
	Title string `json:"title"`
	StartedAt string `json:"started_at,omitempty"`
	Status string `json:"status,omitempty"`
	Organizer string `json:"organizer,omitempty"`
	Venue string `json:"venue,omitempty"`
	Online *bool `json:"online,omitempty"`
	SourceURL string `json:"source_url"`
	ImageURL string `json:"image_url,omitempty"`
	FlyerURL string `json:"flyer_url,omitempty"`
}

type SemanticEvent struct {
	Event
	Technology []string `json:"technology"`
	Theme []string `json:"theme"`
	Community []string `json:"community"`
	Place string `json:"place,omitempty"`
	Time string `json:"time,omitempty"`
	Format string `json:"format"`
	Features []string `json:"features"`
	Completeness float64 `json:"completeness"`
}

func tags(text string) []string {
	rules := []struct { name string; words []string }{
		{"AI", []string{"ai", "人工知能"}}, {"LLM", []string{"llm", "gpt", "生成ai"}},
		{"Data", []string{"data", "bqml", "machine learning", "ml"}}, {"Web", []string{"web", "frontend", "react", "hono"}},
		{"Creative", []string{"p5.js", "creative coding", "creative"}}, {"Agent", []string{"agent", "workflow", "langgraph"}},
		{"Cloud", []string{"cloud", "gcp", "aws", "azure"}}, {"Architecture", []string{"architecture", "建築", "bim", "cad"}},
	}
	var out []string
	for _, r := range rules { for _, w := range r.words { if strings.Contains(text, w) { out = append(out, r.name); break } } }
	return out
}

func normalize(e Event) SemanticEvent {
	text := strings.ToLower(e.Title + " " + e.Organizer)
	t := tags(text); if len(t) == 0 { t = []string{"Community"} }
	format := "offline"; if e.Online != nil && *e.Online { format = "online" }
	var tm, place string
	if e.StartedAt != "" { if parsed, err := time.Parse(time.RFC3339, e.StartedAt); err == nil { tm = parsed.Format("2006-01") } }
	if e.Venue != "" { place = e.Venue }
	features := append([]string{}, t...); features = append(features, format)
	if place != "" { features = append(features, "place") }; if e.Organizer != "" { features = append(features, "community") }
	filled := 0; for _, v := range []string{e.Title, e.StartedAt, e.SourceURL, e.Organizer, e.Venue} { if v != "" { filled++ } }
	community := []string{}; if e.Organizer != "" { community = []string{e.Organizer} }
	return SemanticEvent{Event:e, Technology:t, Theme:t, Community:community, Place:place, Time:tm, Format:format, Features:features, Completeness:float64(filled)/5}
}

func main() {
	in := flag.String("in", "data/connpass/v0n5ai.jsonl", "input JSONL")
	out := flag.String("out", "web/data/visualization.json", "output JSON")
	expected := flag.Int("expected", 176, "expected canonical population")
	flag.Parse()
	info, err := os.Stat(*in); if err != nil || info.Size() == 0 { panic(fmt.Sprintf("DATA_GATE_FAILED: input JSONL missing or empty: %s", *in)) }
	f, err := os.Open(*in); if err != nil { panic(err) }; defer f.Close()
	var events []SemanticEvent
	seen := map[string]bool{}
	s := bufio.NewScanner(f); s.Buffer(make([]byte, 1024), 1024*1024)
	for s.Scan() {
		var e Event
		if json.Unmarshal(s.Bytes(), &e) == nil && e.SourceURL != "" {
			if e.EventID == "" || seen[e.EventID] { panic("DATA_GATE_FAILED: missing or duplicate event_id") }
			seen[e.EventID] = true
			events = append(events, normalize(e))
		}
	}
	if err := s.Err(); err != nil { panic(err) }
	if len(events) != *expected { panic(fmt.Sprintf("POPULATION_GATE_FAILED: expected=%d actual=%d", *expected, len(events))) }
	data, err := json.MarshalIndent(events, "", "  "); if err != nil { panic(err) }
	if err := os.MkdirAll("web/data", 0755); err != nil { panic(err) }
	if err := os.WriteFile(*out, append(data, '\n'), 0644); err != nil { panic(err) }
	fmt.Printf("normalized=%d out=%s\n", len(events), *out)
}
