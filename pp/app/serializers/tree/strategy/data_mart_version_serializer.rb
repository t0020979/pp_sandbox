# frozen_string_literal: true

class Tree::Strategy::DataMartVersionSerializer < Tree::Strategy::BaseSerializer
  def id
    "v_#{@object.id}"
  end

  def type
    :attr_data_mart
  end

  def opened?
    @opened ||= load?
  end

  def disabled?
    @instance_options.dig(:config, :disabled)&.include?('data_mart_version')
  end

  attribute(:data) do
    {
      kind: :data_mart_version,
      id: id,
      guid: @object.guid,
      data_mart_id: @object.data_mart_id,
      data_mart_version_id: @object.id,
      data_mart_version_code: @object.code,
      data_mart_mnemonic: @object.data_mart.mnemonic
    }
  end

  protected

  def load?
    @load ||= included_in_options?(:load, :data_mart_version_ids)
  end


  def element_serializer
    Tree::Strategy::DataMartTableSerializer
  end

  def collection
    tables = @object.data_mart_tables.active

    if instance_options.dig(:allowed, :data_mart_table_ids).is_a?(Array)
      tables = tables.where(id: instance_options.dig(:allowed, :data_mart_table_ids))
    end

    tables
  end
end
