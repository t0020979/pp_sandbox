# frozen_string_literal: true

class Podd::UpdateDataMartInformationSchemaService < Podd::ImportBaseService

  attr_reader :data_mart, :dm_mnemonic, :is_mnemonic, :only_rows

  def initialize(data_mart_id)
    @logger = Rails.logger
    @data_mart = DataMart.find_by(id: data_mart_id)
    @dm_mnemonic = data_mart.mnemonic
    @is_mnemonic = data_mart.infosys_lkuv_in_prod_content&.dig('mnemonic')
    @only_rows = true
  end

  def call
    if !dm_mnemonic || !is_mnemonic
      logger.fatal "Ошибка при чтении мнемоник: #{dm_mnemonic} /  #{is_mnemonic}"
    end
    execute_request

    if response.dig('rows').eql?(data_mart.changes_count)
      return
    end
    data_mart.changes_count_updated_at = Time.now
    data_mart.changes_count = response.dig('rows')

    @only_rows = false

    execute_request

    data_mart.update_data_marts_information_schemas(response.dig('result'))

    # Сохраняем изменения
    if data_mart.save
      logger.info "Данные успешно сохранены!"
    else
      logger.fatal "Ошибка при сохранении: #{data_mart.errors.full_messages.join(', ')}"
    end
  end

  private

  def parse_response(value)
    JSON.parse(value.force_encoding('UTF-8'))
  rescue => exception
    logger.fatal "#{self.class.name}#parse_response guard exception:\n #{exception.inspect}"
  end

  def request_body
    if only_rows
      { "query": "GET_CHANGES(#{dm_mnemonic})" }
    else
      { "query": "SELECT DISTINCT c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.DATA_TYPE, con.CONSTRAINT_TYPE FROM INFORMATION_SCHEMA.COLUMNS c LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE u ON u.table_schema = c.table_schema AND u.table_name = c.table_name AND u.column_name = c.column_name LEFT OUTER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS con ON con.constraint_schema = u.constraint_schema AND con.table_schema = u.table_schema AND con.constraint_catalog = u.constraint_catalog AND con.table_name = u.table_name JOIN information_schema.tables AS TT ON c.table_schema = TT.table_schema and c.table_name = TT.table_name WHERE TT.table_schema = upper('#{dm_mnemonic}') AND (con.CONSTRAINT_TYPE = 'primary key' OR con.CONSTRAINT_TYPE IS NULL)" }
    end.to_json
  end

  def request_url
    ENV.fetch(env_var_name('PODD_DATA_MART_INFORMATION_SCHEMAS_URL')).gsub('{NAME_IS}', is_mnemonic)
  end
end
