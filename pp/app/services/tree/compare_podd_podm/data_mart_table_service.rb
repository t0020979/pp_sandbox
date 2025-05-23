# frozen_string_literal: true
class Tree::ComparePoddPodm::DataMartTableService < Tree::ComparePoddPodm::BaseService

  def initialize(params, data_mart: nil, table_schema: nil, &policy_scoper)
    super(params, data_mart: data_mart, &policy_scoper)

    @table_schema = table_schema if table_schema.present?
  end

  def call
    return Tree::BaseService.empty_nodes if data_mart.blank? || table_schema.blank?

    super
  end

  private

  # @todo скоупы вынести в модель
  def collection
    @collection ||= data_mart.data_marts_information_schemas
                             .where(table_schema: table_schema)
                             .distinct.pluck(:table_schema, :table_name).map(&:last).sort
  end

  def table_schema
    @table_schema ||= params[:parent_id]&.start_with?('v_') ? params[:parent_id][2..] : ''
  end

  def build_node(element)
    {
      id: 't_' + element,
      text: element,
      type: :attr_common,
      state:  { opened: false },
      children: children(element)
    }
  end

  def children(element)
    Tree::ComparePoddPodm::DataAttributeService.call(params, data_mart: @data_mart, table_name: element, &policy_scoper)
  end
end