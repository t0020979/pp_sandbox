# frozen_string_literal: true

class DataMarts::InformationSchema < ApplicationRecord
  belongs_to :data_mart

  validates :table_schema, :table_name, :column_name, :data_type, presence: true

  # Константа для уникального набора ключей
  UNIQUE_KEYS = %w[table_schema table_name column_name constraint_type].freeze

  scope :by_table_name, ->(names) { where(table_name: names) }

  def unique_key
    @unique_key ||= self.slice(*UNIQUE_KEYS).values
  end

  def self.grouped_as_hash
    pluck('table_schema', 'table_name', 'column_name', 'data_type', 'constraint_type')
      .then do |records|
      records.group_by(&:first)
             .transform_values do |tables|
        tables.group_by(&:second)
              .transform_values do |cols|
          cols.map { |_schema, _table, col, type, constraint|
            { column_name: col, data_type: type, constraint_type: constraint }
          }
        end
      end
    end
  end
end
