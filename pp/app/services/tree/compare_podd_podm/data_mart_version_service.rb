# frozen_string_literal: true
class Tree::ComparePoddPodm::DataMartVersionService < Tree::ComparePoddPodm::BaseService

  def call
    return Tree::BaseService.empty_nodes if data_mart.blank?

    super
  end

  private

  # @todo скоупы вынести в модель
  def collection
    @collection ||= data_mart.data_marts_information_schemas.distinct.pluck(:table_schema)
  end

  def build_node(element)
    {
      id: 'v_' + element,
      text: element,
      type: :attr_common,
      state:  { opened: true },
      children: children(element)
    }
  end

  def children(element)
    Tree::ComparePoddPodm::DataMartTableService.call(params, data_mart: @data_mart, table_schema: element, &policy_scoper)
  end
end