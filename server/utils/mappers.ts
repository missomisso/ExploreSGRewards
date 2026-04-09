export function mapUser(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    profileImageUrl: row.profile_image_url,
    role: row.role,
    businessName: row.business_name,
    businessDescription: row.business_description,
    level: row.level,
    points: row.points,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMission(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    description: row.description,
    location: row.location,
    totalPoints: row.total_points,
    category: row.category,
    imageUrl: row.image_url,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    tasks: row.tasks ?? [],
    createdAt: row.created_at,
  };
}

export function mapUserMission(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    missionId: row.mission_id,
    status: row.status,
    completedTasks: row.completed_tasks ?? [],
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function mapSubmission(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    missionId: row.mission_id,
    taskId: row.task_id,
    type: row.type,
    proofUrl: row.proof_url,
    answer: row.answer,
    status: row.status,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  };
}

export function mapReward(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    cost: row.cost,
    merchant: row.merchant,
    icon: row.icon,
    category: row.category,
    expiryDays: row.expiry_days,
    quantityLimit: row.quantity_limit,
    businessId: row.business_id,
    createdAt: row.created_at,
  };
}

export function mapUserReward(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    rewardId: row.reward_id,
    code: row.code,
    used: row.used,
    claimedAt: row.claimed_at,
    expiresAt: row.expires_at,
  };
}

export function mapNotification(row: any) {
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    relatedId: row.related_id,
    createdAt: row.created_at,
  };
}
