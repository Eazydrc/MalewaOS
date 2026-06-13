SELECT id, "firstName", "lastName", email, role,
       CASE WHEN password IS NULL THEN 'PAS DE MOT DE PASSE (compte Google)' ELSE 'MOT DE PASSE OK' END as "passwordStatus",
       "googleId",
       "createdAt"
FROM "User"
WHERE email = 'jsonlileflo1@gmail.com';
