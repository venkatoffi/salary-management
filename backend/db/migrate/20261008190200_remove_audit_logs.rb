class RemoveAuditLogs < ActiveRecord::Migration[8.0]
  def change
    drop_table :audit_logs, if_exists: true
  end
end
