# frozen_string_literal: true

class Tree::Strategy::DataAttributeSerializer < Tree::Strategy::BaseSerializer

  def id
    "a_#{@object.id}"
  end

  def type
    "attr_#{object_decorated.key_status}"
  end

  attribute(:uid) do
    @object.tech_name
  end

  attribute(:data) do
    {
      kind: :attribute,
      id: id,
      guid: @object.guid,
      name: @object.name,
      data_attribute_id: @object.id,
      data_attribute_tech_name: @object.tech_name,
      data_mart_version_id: data_mart_version.id,
      prostore_alias: @object.data_type_content&.dig('prostore_alias')
    }
  end

  def selected?
    @selected ||= included_in_options?(:selected, :data_attribute_ids)
  end

  attribute(:children) do
    []
  end

  protected

  def data_mart_version
    @data_mart_version ||= @object.data_mart_table.data_mart_version
  end
end
