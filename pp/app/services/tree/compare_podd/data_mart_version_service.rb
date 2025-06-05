# frozen_string_literal: true
class Tree::ComparePodd::DataMartVersionService < Tree::ComparePodd::BaseService

  def call
    return Tree::BaseService.empty_nodes if data_mart_version.blank?

    data_mart_version.update_compare_podd_status

    build_node(data_mart_version)
  end

  private

  def data_mart_version
    @data_mart_version ||= begin
                             params.dig(:code) ?
                               data_mart.version_by_code(params[:code]) :
                               data_mart.registered_in_prod_version
                           end
  end

  def element_serializer
    Tree::Strategy::ComparePodd::DataMartVersionSerializer
  end
end