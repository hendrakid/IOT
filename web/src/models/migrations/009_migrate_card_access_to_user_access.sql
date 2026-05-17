-- Migration: Move card_access_points to user_access_points
-- For each card_access_points entry, assign access to the card's user in user_access_points if not already present

INSERT INTO user_access_points (user_id, access_point_id, granted_by, granted_at)
SELECT c.user_id, cap.access_point_id, cap.granted_by, cap.granted_at
FROM card_access_points cap
JOIN cards c ON cap.card_id = c.id
LEFT JOIN user_access_points uap
  ON uap.user_id = c.user_id AND uap.access_point_id = cap.access_point_id
WHERE uap.id IS NULL;
