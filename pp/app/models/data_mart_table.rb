class DataMartTable < ApplicationRecord

  def data_marts_information_schemas
    @data_marts_information_schemas ||= data_mart.data_marts_information_schemas.by_table_name(tech_name.upcase)
  end

  def data_marts_information_schemas_as_a
    @data_marts_information_schemas_as_a ||= data_mart.data_marts_information_schemas.by_table_name(tech_name.upcase).to_a
  end

  def compare_podd_status
    @compare_podd_status ||=
      begin
        podd_attr_count = data_marts_information_schemas.count { |e| data_attributes.pluck(:tech_name).map(&:upcase).include?(e.column_name) }

        return :danger if podd_attr_count.zero?

        data_attributes.all? { |a| a.compare_podd_status.eql?(:success) } ? :success : :warning
      end
  end
end
