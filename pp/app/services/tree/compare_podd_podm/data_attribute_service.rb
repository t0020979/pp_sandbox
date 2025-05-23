# frozen_string_literal: true
class Tree::ComparePoddPodm::DataAttributeService < Tree::ComparePoddPodm::BaseService

  def initialize(params, data_mart: nil, table_name: nil, &policy_scoper)
    super(params, data_mart: data_mart, &policy_scoper)

    @table_name = table_name if table_name.present?
  end

  def call
    return Tree::BaseService.empty_nodes if data_mart.blank? || table_name.blank?

    super
  end

  private

  # @todo скоупы вынести в модель
  def collection
    @collection ||= data_mart.data_marts_information_schemas.where(table_name: table_name)
  end

  # @todo ключить сериализатор к данному сервису
  # возможно вынести в декоратор реализацию text поля
  def build_node(element)
    key_sign = element.constraint_type.eql?('primary key') ? '<i class="fas fa-key text-warning"></i>' : ''
    type_badge = "<span class=\"btn btn-xs btn-outline-success mr-2\">#{element.data_type}</span>"

    {
      id: "a_#{element.id}_#{element.column_name}",
      text:  "#{element.column_name} #{key_sign} #{type_badge}".html_safe,
      type: :attr_common,
      state:  { opened: false },
      children: false
    }
  end

  def table_name
    @table_name ||= params[:parent_id]&.start_with?('t_') ? params[:parent_id][2..] : ''
  end
end