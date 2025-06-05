class DataMart < ApplicationRecord


  def ready_to_update_data_marts_information_schemas?
    return true unless changes_count_updated_at
    delta = ENV.fetch('PODD_DATA_MART_INFORMATION_SCHEMAS_UPDATE_TIMEOUT_MINUTES', 1).to_i
    delta.minutes.ago > changes_count_updated_at
  end

  def update_data_marts_information_schemas(new_schemas)
    # Приводим ключи (имена полей модели) к нижнему регистру
    new_schemas.map! { |row| row.transform_keys(&:downcase) }

    # Собираем уникальные идентификаторы из входного массива
    new_unique_keys = new_schemas.map do |row|
      row.slice(*DataMarts::InformationSchema::UNIQUE_KEYS).values
    end

    # Помечаем к удалению записи, которых нет во входном массиве
    self.data_marts_information_schemas.each do |schema|
      if !new_unique_keys.include?(schema.unique_key)
        schema.mark_for_destruction
      end

    end

    cur_unique_keys = data_marts_information_schemas.map(&:unique_key)

    # Добавляем новые записи
    new_schemas.each do |row|
      if !cur_unique_keys.include?(row.slice(*DataMarts::InformationSchema::UNIQUE_KEYS).values)
        data_marts_information_schemas.build(row)
      end
    end
  end

end
