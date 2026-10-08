roles = [
  {
    name: "Chiefs",
    description: "Senior-level executives responsible for overall business leadership and strategic decision-making, including roles such as CEO, CFO, and CTO."
  },
  {
    name: "HR Manager",
    description: "Responsible for leading the Human Resources function, managing HR operations, employee relations, recruitment, and organizational policies."
  },
  {
    name: "Department Heads",
    description: "Leaders responsible for managing individual departments, overseeing their teams, and ensuring departmental goals and business objectives are achieved."
  },
  {
    name: "Employees",
    description: "Employees who work within the organization and perform responsibilities assigned to their respective departments and roles."
  }
]

departments = [
  {
    name: "Engineering",
    description: "Responsible for designing, developing, testing, and maintaining software applications and technical products."
  },
  {
    name: "Human Resources",
    description: "Responsible for employee management, recruitment, onboarding, payroll coordination, performance management, and employee engagement."
  },
  {
    name: "Finance",
    description: "Responsible for financial planning, accounting, budgeting, payroll processing, expense management, and financial reporting."
  },
  {
    name: "Sales and Marketing",
    description: "Responsible for generating business opportunities, managing client relationships, sales activities, marketing campaigns, and brand promotion."
  },
  {
    name: "Information Technology",
    description: "Responsible for managing internal IT infrastructure, systems, networks, security, technical support, and enterprise technology services."
  },
  {
    name: "Operations",
    description: "Responsible for managing day-to-day business operations, process improvements, resource coordination, compliance, and operational efficiency."
  }
]

roles.each do |attributes|
  Role.find_or_initialize_by(name: attributes[:name]).update!(attributes)
end

departments.each do |attributes|
  Department.find_or_initialize_by(name: attributes[:name]).update!(attributes)
end

require_relative "seeds/users"
