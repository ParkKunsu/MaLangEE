/** API types */
export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface DuplicateCheckResponse {
  is_available: boolean;
}

export interface DailyReflection {
  id: number;
  user_id: number;
  content: string;
  feedback: string | null;
  created_at: string;
}

export interface DailyReflectionCreate {
  content: string;
}

export interface QuickResponse {
  id: number;
  user_id: number;
  scenario: string;
  user_response: string;
  response_time: number;
  grammar_score: number | null;
  naturalness_score: number | null;
  feedback: string | null;
  created_at: string;
}

export interface QuickResponseCreate {
  scenario: string;
  user_response: string;
  response_time: number;
}

export interface QuickResponseScenario {
  scenario: string;
  scenario_kr: string;
}

export interface ThinkAloud {
  id: number;
  user_id: number;
  topic: string;
  content: string;
  word_count: number | null;
  ttr: number | null;
  logical_connectors_count: number | null;
  feedback: string | null;
  created_at: string;
}

export interface ThinkAloudCreate {
  topic: string;
  content: string;
}

export interface ThinkAloudTopic {
  topic: string;
  topic_kr: string;
}

export interface Rephrasing {
  id: number;
  user_id: number;
  original_sentence: string;
  user_rephrasing: string;
  similarity_score: number | null;
  diversity_score: number | null;
  feedback: string | null;
  created_at: string;
}

export interface RephrasingCreate {
  original_sentence: string;
  user_rephrasing: string;
}

export interface RephrasingSentence {
  sentence: string;
}

export interface ScenarioMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Scenario {
  id: number;
  user_id: number;
  scenario_type: string;
  messages: ScenarioMessage[];
  turn_count: number;
  completed: number;
  created_at: string;
  updated_at: string;
}

export interface ScenarioCreate {
  scenario_type: string;
}

export interface ScenarioType {
  type: string;
  name: string;
  name_kr: string;
}

