# frozen_string_literal: true
class Tree::ComparePodd::BaseService < Tree::BaseService

  def initialize(params, data_mart_source: nil, &policy_scoper)
    super(params, &policy_scoper)

    @data_mart = data_mart_source if data_mart_source.present?
  end

  private

  def data_mart
    @data_mart ||= policy_scope(DataMart.where(id: params[:data_mart_id])).take
  end

end