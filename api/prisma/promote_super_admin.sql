-- Promouvoir Jospin Lilemo en SUPER_ADMIN
UPDATE "User"
SET role = 'SUPER_ADMIN'
WHERE (
  (LOWER("firstName") = 'jospin' AND LOWER("lastName") = 'lilemo')
  OR email ILIKE '%jospin%'
  OR email ILIKE '%lilemo%'
);

-- Vérification
SELECT id, "firstName", "lastName", email, role, "createdAt"
FROM "User"
ORDER BY "createdAt" ASC;
