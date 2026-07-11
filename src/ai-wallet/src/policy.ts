import type {
  AiWallet,
  AiWalletCommand,
  AiWalletDecision,
  AiWalletPolicy,
  AiWalletPolicyEvaluation,
  AiWalletReasonCode,
  AiWalletDailyUsage,
  CreateAiWalletInput,
  NetworkMode,
} from './types.js';
import { makeAiWalletId } from './id.js';

export const ALPHA_ALLOWED_MODES: readonly NetworkMode[] = ['paper', 'testnet'];

export const DEFAULT_AI_WALLET_POLICY: AiWalletPolicy = {
  policy