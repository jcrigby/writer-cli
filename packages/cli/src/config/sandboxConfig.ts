/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Settings } from './settings.js';

interface CliArgs {
  model: string | undefined;
  sandbox: boolean | string | undefined;
  'sandbox-image': string | undefined;
  debug: boolean | undefined;
  prompt: string | undefined;
  all_files: boolean | undefined;
  show_memory_usage: boolean | undefined;
  yolo: boolean | undefined;
  telemetry: boolean | undefined;
  checkpointing: boolean | undefined;
  telemetryTarget: string | undefined;
  telemetryOtlpEndpoint: string | undefined;
  telemetryLogPrompts: boolean | undefined;
}

export interface SandboxConfig {
  command: 'docker' | 'podman' | 'sandbox-exec';
  image: string;
}

export async function loadSandboxConfig(
  settings: Settings,
  argv: CliArgs,
): Promise<SandboxConfig> {
  // For now, return a basic sandbox config
  // This can be enhanced later based on actual requirements
  return {
    command: 'docker',
    image: 'writer-cli-sandbox',
  };
}