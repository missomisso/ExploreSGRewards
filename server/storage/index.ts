import { usersStorage } from "./users";
import { missionsStorage } from "./missions";
import { submissionsStorage } from "./submissions";
import { rewardsStorage } from "./rewards";
import { notificationsStorage } from "./notifications";

export const sbStorage = {
  ...usersStorage,
  ...missionsStorage,
  ...submissionsStorage,
  ...rewardsStorage,
  ...notificationsStorage,
};
