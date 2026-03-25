import { z } from "zod";

const tyreCompoundSchema = z.enum([
  "soft",
  "medium",
  "hard",
  "intermediate",
  "wet",
]);

const driverSnapshotSchema = z.object({
  code: z.string().min(2).max(3).toUpperCase(),
  position: z.number().int().positive(),
  gapToLeaderSeconds: z.number().min(0),
  tyreCompound: tyreCompoundSchema,
});

const raceStateSchema = z
  .object({
    grandPrix: z.string().min(3),
    lap: z.number().int().positive(),
    totalLaps: z.number().int().positive(),
    weather: z.string().min(2),
    trackCondition: z.enum(["dry", "damp", "wet"]),
    safetyCarDeployed: z.boolean(),
    topDrivers: z.array(driverSnapshotSchema).min(1).max(20),
  })
  .superRefine((value, ctx) => {
    if (value.lap > value.totalLaps) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lap"],
        message: "Lap cannot exceed totalLaps",
      });
    }
  });

export const commentaryRequestSchema = z.object({
  raceState: raceStateSchema,
  tone: z.enum(["hype", "analytical", "neutral"]),
  maxWords: z.number().int().min(30).max(250),
  includeStrategyInsights: z.boolean(),
});

export type CommentaryRequestInput = z.input<typeof commentaryRequestSchema>;
export type CommentaryRequestValidated = z.output<
  typeof commentaryRequestSchema
>;

export function parseCommentaryRequest(
  input: unknown,
): CommentaryRequestValidated {
  return commentaryRequestSchema.parse(input);
}
