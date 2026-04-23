// ============================================================
//  LexForge — In-memory Checklist Store (V1)
//  Shared between POST /api/checklists and PATCH …/items/:itemId
// ============================================================

export type ChecklistItemStatus = "not_started" | "in_progress" | "completed";

export type ChecklistItem = {
  id: string;
  obligation_id: string;
  law_slug: string;
  law_short_title: string;
  title: string;
  description: string;
  action_required: string;
  category: string;
  priority: string;
  status: ChecklistItemStatus;
};

export type ChecklistRecord = {
  id: string;
  assessment_id: string;
  items: ChecklistItem[];
  created_at: string;
};

export const checklists = new Map<string, ChecklistRecord>();
