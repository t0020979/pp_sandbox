class DataMartVersion < ApplicationRecord

  def data_marts_information_schemas
    @data_marts_information_schemas ||=
      data_mart.data_marts_information_schemas.by_table_name(data_mart_tables.pluck(:tech_name).map(&:upcase))
  end

  def compare_podd_status
    @compare_podd_status ||= data_mart_tables.all?{|t| t.compare_podd_status.eql?(:success)} ? :success : :warning
  end

  def compare_podd_status_success?
    compare_podd_status.eql?(:success)
  end

  def compare_podd_status_warning?
    compare_podd_status.eql?(:warning)
  end

  def update_compare_podd_status
    # @todo - вызвать сервис информирования если сменился статус версии после сравнения ЕИП с ПОДД
    unless data_mart.compare_podd_status.eql?(compare_podd_status)
      # if compare_podd_status_warning?
      #  # @todo - Не совпадает модель витрины
      # end
      data_mart.update_columns(compare_podd_status: compare_podd_status)
    end
  end

end
