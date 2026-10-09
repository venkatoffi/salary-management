class Api::V1::CurrentUserPayload
  def self.call(user)
    permissions = Api::V1::AccessPolicy.new(user).capabilities

    {
      id: user.id,
      name: [ user.first_name, user.last_name ].compact.join(" "),
      email: user.email,
      role_name: user.role.name,
      role_id: user.role_id,
      department_id: user.department_id,
      permission_scope: permissions.fetch(:permission_scope),
      capabilities: permissions.except(:permission_scope)
    }
  end
end
