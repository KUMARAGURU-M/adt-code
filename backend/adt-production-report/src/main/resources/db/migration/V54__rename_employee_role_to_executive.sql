-- Drop the old check constraint
ALTER TABLE attendance_employees DROP CONSTRAINT IF EXISTS attendance_employees_category_check;

-- Update existing category values in attendance_employees
UPDATE attendance_employees SET category = 'Executive' WHERE category = 'Employee';

-- Re-create the check constraint with 'Executive' instead of 'Employee'
ALTER TABLE attendance_employees ADD CONSTRAINT attendance_employees_category_check CHECK (category IN (
    'Admin', 'Executive', 'Team Leader', 'Manager',
    'Senior Operator', 'Operator', 'Coordinator'
));

-- Update the roles table to rename 'Employee' role to 'Executive'
UPDATE roles SET name = 'Executive' WHERE name = 'Employee';
