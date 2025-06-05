class DataAttribute < ApplicationRecord

  def compare_podd_status
    @compare_podd_status ||=
      begin
        podd_attrs = data_mart_table.data_marts_information_schemas_as_a.filter { |e| e.column_name == tech_name.upcase }

        return :danger if podd_attrs.none?

        if podd_attrs.any? { |e| (e.constraint_type.eql?('primary key') == pkey) && e.data_type == data_type.dig(:content, :prostore_alias) }
          :success
        else
          :warning
        end
      end
  end

end
