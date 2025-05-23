# frozen_string_literal: true
class Tree::ComparePoddPodm::BaseService < Tree::BaseService

  def initialize(params, data_mart: nil, &policy_scoper)
    super(params, &policy_scoper)

    @data_mart = data_mart if data_mart.present?
  end

  def call
    build_collection(collection)
  end

  private

  def build_collection(collection)
    collection.map { |element| build_node(element) }
  end

  def build_node(element)
    NotImplementedError
  end

  def data_mart
    @data_mart ||= policy_scope(DataMart.where(id: params[:data_mart_id])).take
  end

end