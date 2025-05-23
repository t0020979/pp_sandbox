# frozen_string_literal: true
class Tree::ComparePodd::DataMartTableService < Tree::ComparePodd::BaseService

  def call
    version_id = parent_id.sub(/^v_/, '').to_i
    version = policy_scope(DataMartVersion).find_by(id: version_id)

    return Tree::BaseService.empty_nodes unless version

    tables = policy_scope(version.data_mart_tables.kind_regular)
    build_collection(tables)
  end

  private

  def element_serializer
    Tree::Strategy::ComparePodd::DataMartTableSerializer
  end
end