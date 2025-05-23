# frozen_string_literal: true
class Tree::ComparePodd::DataAttributeService < Tree::ComparePodd::BaseService

  def call
    table_id = parent_id.sub(/^t_/, '').to_i
    table = policy_scope(DataMartTable).find_by(id: table_id)

    return Tree::BaseService.empty_nodes unless table

    attributes = policy_scope(table.data_attributes)
    build_collection(attributes)
  end

  private

  def element_serializer
    Tree::Strategy::ComparePodd::DataAttributeSerializer
  end
end