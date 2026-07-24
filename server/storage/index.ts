import { usersStorage } from "./users.js";
import { missionsStorage } from "./missions.js";
import { submissionsStorage } from "./submissions.js";
import { rewardsStorage } from "./rewards.js";
import { notificationsStorage } from "./notifications.js";

export const sbStorage = {
  ...usersStorage,
  ...missionsStorage,
  ...submissionsStorage,
  ...rewardsStorage,
  ...notificationsStorage,
};
