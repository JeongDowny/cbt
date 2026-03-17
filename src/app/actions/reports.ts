"use server";

import { getAttemptReportAction as getAttemptReport } from "@/features/reports/server/attempt-lookup";
import { lookupAttemptsAction as lookupAttempts } from "@/features/reports/server/attempt-lookup";
import { submitAttemptAction as submitAttempt } from "@/features/reports/server/attempt-submit";
import { deleteAttemptWorkImageAction as deleteAttemptWorkImage } from "@/features/reports/server/attempt-work-images";
import { uploadAttemptWorkImageAction as uploadAttemptWorkImage } from "@/features/reports/server/attempt-work-images";

export async function submitAttemptAction(input: Parameters<typeof submitAttempt>[0]) {
  return submitAttempt(input);
}

export async function getAttemptReportAction(attemptId: string) {
  return getAttemptReport(attemptId);
}

export async function lookupAttemptsAction(input: Parameters<typeof lookupAttempts>[0]) {
  return lookupAttempts(input);
}

export async function uploadAttemptWorkImageAction(formData: FormData) {
  return uploadAttemptWorkImage(formData);
}

export async function deleteAttemptWorkImageAction(formData: FormData) {
  return deleteAttemptWorkImage(formData);
}
