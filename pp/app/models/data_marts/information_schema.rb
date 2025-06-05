# frozen_string_literal: true

# == Schema Information
#
# Table name: data_marts_information_schemas
#
#  id              :bigint           not null, primary key
#  column_name     :string
#  constraint_type :string
#  data_type       :string
#  table_name      :string
#  table_schema    :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  data_mart_id    :bigint
#
# Indexes
#
#  index_data_marts_information_schemas_on_data_mart_id  (data_mart_id)
#
# Foreign Keys
#
#  fk_rails_...  (data_mart_id => data_marts.id)
#
class DataMarts::InformationSchema < ApplicationRecord
  belongs_to :data_mart

  validates :table_schema, :table_name, :column_name, :data_type, presence: true

  # Константа для уникального набора ключей
  UNIQUE_KEYS = %w[table_schema table_name column_name constraint_type].freeze

  scope :by_table_name, ->(names) { where(table_name: names) }

  def unique_key
    @unique_key ||= self.slice(*UNIQUE_KEYS).values
  end
end
