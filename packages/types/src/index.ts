export type TrackCondition = "dry" | "damp" | "wet";

export type CommentaryTone = "hype" | "analytical" | "neutral";

export interface DriverSnapshot {
  code: string;
  position: number;
  gapToLeaderSeconds: number;
  tyreCompound: "soft" | "medium" | "hard" | "intermediate" | "wet";
}

export interface RaceState {
  grandPrix: string;
  lap: number;
  totalLaps: number;
  weather: string;
  trackCondition: TrackCondition;
  safetyCarDeployed: boolean;
  topDrivers: DriverSnapshot[];
}

export interface CommentaryRequest {
  raceState: RaceState;
  tone: CommentaryTone;
  maxWords: number;
  includeStrategyInsights: boolean;
}

export interface CommentaryResponse {
  text: string;
  generatedAtIso: string;
  model: string;
}

export type WsCommentaryTone = "neutral" | "hyped" | "technical";

export interface WsCommentaryRequest {
  season: number;
  round: number;
  driver: string;
  event: string;
  tone: WsCommentaryTone;
  includeTelemetry: boolean;
}

export interface WsCommentaryResponse {
  message: string;
  generatedAt: string;
}

export interface WsIncomingPayload {
  action?: string;
  season?: unknown;
  round?: unknown;
  driver?: unknown;
  event?: unknown;
  tone?: unknown;
  includeTelemetry?: unknown;
}

export interface CommentaryGeneratorPort {
  generate(input: WsCommentaryRequest): Promise<WsCommentaryResponse>;
}

export interface DriverPointer {
  code: string;
  number: number;
  fullName: string;
  team: string;
  color: string;
  pace: number;
  progress: number;
}

export const initialPointers: DriverPointer[] = [
  {
    code: "RUS",
    number: 63,
    fullName: "George Russell",
    team: "Mercedes",
    color: "#27F4D2",
    pace: 0.141,
    progress: 0.02,
  },
  {
    code: "ANT",
    number: 12,
    fullName: "Kimi Antonelli",
    team: "Mercedes",
    color: "#27F4D2",
    pace: 0.14,
    progress: 0.05,
  },
  {
    code: "LEC",
    number: 16,
    fullName: "Charles Leclerc",
    team: "Ferrari",
    color: "#F91536",
    pace: 0.139,
    progress: 0.08,
  },
  {
    code: "HAM",
    number: 44,
    fullName: "Lewis Hamilton",
    team: "Ferrari",
    color: "#F91536",
    pace: 0.138,
    progress: 0.11,
  },
  {
    code: "NOR",
    number: 4,
    fullName: "Lando Norris",
    team: "McLaren",
    color: "#FF8000",
    pace: 0.14,
    progress: 0.14,
  },
  {
    code: "PIA",
    number: 81,
    fullName: "Oscar Piastri",
    team: "McLaren",
    color: "#FF8000",
    pace: 0.135,
    progress: 0.17,
  },
  {
    code: "OCO",
    number: 31,
    fullName: "Esteban Ocon",
    team: "Haas F1 Team",
    color: "#B6BABD",
    pace: 0.132,
    progress: 0.2,
  },
  {
    code: "BEA",
    number: 87,
    fullName: "Oliver Bearman",
    team: "Haas F1 Team",
    color: "#B6BABD",
    pace: 0.131,
    progress: 0.23,
  },
  {
    code: "VER",
    number: 1,
    fullName: "Max Verstappen",
    team: "Red Bull Racing",
    color: "#3671C6",
    pace: 0.142,
    progress: 0.26,
  },
  {
    code: "HAD",
    number: 6,
    fullName: "Isack Hadjar",
    team: "Red Bull Racing",
    color: "#3671C6",
    pace: 0.13,
    progress: 0.29,
  },
  {
    code: "LAW",
    number: 30,
    fullName: "Liam Lawson",
    team: "Racing Bulls",
    color: "#6692FF",
    pace: 0.13,
    progress: 0.32,
  },
  {
    code: "LIN",
    number: 47,
    fullName: "Arvid Lindblad",
    team: "Racing Bulls",
    color: "#6692FF",
    pace: 0.127,
    progress: 0.35,
  },
  {
    code: "ALO",
    number: 14,
    fullName: "Fernando Alonso",
    team: "Aston Martin",
    color: "#229971",
    pace: 0.129,
    progress: 0.38,
  },
  {
    code: "STR",
    number: 18,
    fullName: "Lance Stroll",
    team: "Aston Martin",
    color: "#229971",
    pace: 0.126,
    progress: 0.41,
  },
  {
    code: "ALB",
    number: 23,
    fullName: "Alex Albon",
    team: "Williams",
    color: "#64C4FF",
    pace: 0.128,
    progress: 0.44,
  },
  {
    code: "SAI",
    number: 55,
    fullName: "Carlos Sainz",
    team: "Williams",
    color: "#64C4FF",
    pace: 0.131,
    progress: 0.47,
  },
  {
    code: "GAS",
    number: 10,
    fullName: "Pierre Gasly",
    team: "Alpine",
    color: "#FF87BC",
    pace: 0.129,
    progress: 0.5,
  },
  {
    code: "COL",
    number: 43,
    fullName: "Franco Colapinto",
    team: "Alpine",
    color: "#FF87BC",
    pace: 0.126,
    progress: 0.53,
  },
  {
    code: "HUL",
    number: 27,
    fullName: "Nico Hulkenberg",
    team: "Kick Sauber",
    color: "#52E252",
    pace: 0.125,
    progress: 0.56,
  },
  {
    code: "BOR",
    number: 5,
    fullName: "Gabriel Bortoleto",
    team: "Kick Sauber",
    color: "#52E252",
    pace: 0.124,
    progress: 0.59,
  },
];

export interface RaceControlFeedEvent {
  type: "race_control";
  date: string;
  meeting_key: number;
  session_key: number;
  message: string;
  flag: string;
}

export interface LocationPoint {
  driver_number: number;
  x: number;
  y: number;
  z: number;
}

export interface LocationFeedEvent {
  type: "location";
  date: string;
  meeting_key: number;
  session_key: number;
  data: LocationPoint[];
}

export interface OvertakeFeedEvent {
  type: "overtake";
  date: string;
  overtaking_driver_number: number;
  overtaken_driver_number: number;
  position: number;
}

export interface SessionEventFeed {
  type: "event";
  date: string;
  event_type: string;
  driver_number?: number;
  lap?: number;
  sector?: number;
}

export interface RaceFinishResult {
  position: number;
  driver_number: number;
}

export interface RaceFinishFeedEvent {
  type: "event";
  date: string;
  event_type: "RACE_FINISH";
  results: RaceFinishResult[];
}

export type LiveRaceFeedEvent =
  | RaceControlFeedEvent
  | LocationFeedEvent
  | OvertakeFeedEvent
  | SessionEventFeed
  | RaceFinishFeedEvent;

export interface SendDataEnvelope {
  action: "SendData";
  payload: LiveRaceFeedEvent;
}
