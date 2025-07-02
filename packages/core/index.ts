/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './src/index.js';
export {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_FLASH_MODEL,
  DEFAULT_GEMINI_EMBEDDING_MODEL,
} from './src/config/models.js';

// Writer-specific exports
export { OpenRouterClient, ModelConfig, WritingContext } from './src/core/openrouterClient.js';
export { WritingCommandsService, WritingProject, ProjectSettings } from './src/core/writingCommands.js';
export { ProjectManager, ProjectConfig } from './src/projects/projectManager.js';
export { ManuscriptGitService, GitCommitInfo, ManuscriptDiff } from './src/git/manuscriptGit.js';
export { getModelConfig, getApiKey, DEFAULT_WRITER_MODEL, WRITER_CONFIG_DIR } from './src/config/writerConfig.js';
