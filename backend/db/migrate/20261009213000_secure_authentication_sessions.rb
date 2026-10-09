class SecureAuthenticationSessions < ActiveRecord::Migration[8.0]
  def up
    change_column :authentications, :status, :boolean,
                  using: "status = 'active'",
                  default: true,
                  null: false

    remove_index :authentications, :user_id
    add_index :authentications, :user_id
    remove_index :users, :jti
    remove_column :users, :jti
  end

  def down
    add_column :users, :jti, :string, default: -> { "gen_random_uuid()" }, null: false
    add_index :users, :jti, unique: true
    remove_index :authentications, :user_id
    add_index :authentications, :user_id, unique: true
    change_column :authentications, :status, :string,
                  using: "CASE WHEN status THEN 'active' ELSE 'revoked' END",
                  default: "active",
                  null: false
  end
end
