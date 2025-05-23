# frozen_string_literal: true

class Podd::DataMartInformationSchemaUpdateJob < ApplicationJob

  def perform(data_mart_id = null)

    if data_mart_id
      [data_mart_id]
    else
      DataMart.active.with_registered_version_in_prod.ids
    end.each do |dm_id|
      Podd::UpdateDataMartInformationSchemaService.call(dm_id)
    end

  rescue => exception
    logger.fatal "Podd::DataMartInformationSchemaUpdateJob#perform guard exception: \n #{exception.inspect}"
  end

end
