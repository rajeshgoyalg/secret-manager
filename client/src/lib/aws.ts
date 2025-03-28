/**
 * AWS Utility functions for working with SSM Parameter Store
 * 
 * Note: This is a client-side wrapper that makes calls to our backend API,
 * which in turn uses the AWS SDK to interact with the Parameter Store.
 * We're not using the AWS SDK directly in the browser for security reasons.
 */

import { apiRequest } from "./queryClient";
import { Secret } from "@shared/schema";

interface SSMParams {
  path: string;
  value: string;
  isEncrypted?: boolean;
}

/**
 * Create or update a parameter in AWS SSM Parameter Store via our backend
 */
export async function putParameter({ path, value, isEncrypted = false }: SSMParams): Promise<void> {
  await apiRequest("POST", "/api/aws/ssm/put-parameter", {
    path,
    value,
    isEncrypted
  });
}

/**
 * Get a parameter from AWS SSM Parameter Store via our backend
 */
export async function getParameter(path: string): Promise<string> {
  const response = await apiRequest("GET", `/api/aws/ssm/get-parameter?path=${encodeURIComponent(path)}`, null);
  const data = await response.json();
  return data.value;
}

/**
 * Delete a parameter from AWS SSM Parameter Store via our backend
 */
export async function deleteParameter(path: string): Promise<void> {
  await apiRequest("DELETE", `/api/aws/ssm/delete-parameter?path=${encodeURIComponent(path)}`, null);
}

/**
 * Generate a proper SSM path for a secret
 */
export function generateSSMPath(projectName: string, secretName: string): string {
  const formattedProjectName = projectName.toLowerCase().replace(/ /g, "-");
  return `/secrets-manager/${formattedProjectName}/${secretName}`;
}

/**
 * Format secret for display
 * This is a utility function to format secret values for display
 */
export function formatSecretValue(value: string, isVisible: boolean): string {
  if (!isVisible) {
    return "•".repeat(Math.min(value.length, 16));
  }
  return value;
}
