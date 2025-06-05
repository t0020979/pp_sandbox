# frozen_string_literal: true

class Podd::DataMartInformationSchemaUpdateJob < ApplicationJob

  def perform(data_mart_id = null)

    if data_mart_id
      [data_mart_id]
    else
      DataMart.active.with_registered_version_in_prod.ids
    end.each do |dm_id|
      # сначала вызываем сервис загрузки обновленных данных для выбранной вытрины
      # @todo - добавить логирование результата загрузки
      Podd::UpdateDataMartInformationSchemaService.call(dm_id)
      # затем вызываем сервис построения кэша дерева загруженной Вытрины из ПОДД
      Tree::CacheBuilder::ComparePoddPodm.call(dm_id)
      # третим этапом вызывае сервис обновления кэша дерева для сравнения витрины ЕИП с ПОДД
      Tree::CacheBuilder::ComparePodd.call(dm_id)
    end

  rescue => exception
    logger.fatal "Podd::DataMartInformationSchemaUpdateJob#perform guard exception: \n #{exception.inspect}"
  end

end
