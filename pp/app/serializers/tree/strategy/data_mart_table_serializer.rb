# frozen_string_literal: true

class Tree::Strategy::DataMartTableSerializer < Tree::Strategy::BaseSerializer
  def id
    "t_#{@object.id}"
  end

  def type
    :attr_table
  end

  def opened?
    @opened ||= instance_options.key?(:regulated_query_version) || load?
  end

  # sql_fields for sql_constructor.js
  attribute(:data) do
    {
      kind: :table,
      id: id,
      guid: @object.guid,
      data_mart_table_id: @object.id,
      data_mart_table_name: @object.name,
      data_mart_table_tech_name: @object.tech_name
    }
  end

  protected

  def load?
    @load ||= included_in_options?(:load, :data_mart_table_ids)
  end

  def element_serializer
    Tree::Strategy::DataAttributeSerializer
  end

  def collection
    @object.data_attributes.order(:id)
  end
end
