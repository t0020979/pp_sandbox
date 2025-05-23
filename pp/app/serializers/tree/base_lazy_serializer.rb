# frozen_string_literal: true
#
class Tree::BaseLazySerializer < Tree::BaseSerializer

  def opened?
    false
  end

  attribute(:children) do
    opened? ? children_hash : collection.exists?
  end

  def kind
    :default
  end

  def state
    @state ||=
      if instance_options.dig(:states, kind)
        super
        @state.merge(instance_options.dig(:states, kind).symbolize_keys.map { |k, v| [k, ActiveModel::Type::Boolean.new.cast(v)] }.to_h)
      else
        super
      end
  end

  protected

  # load? => opened? но при этом opened? не обязательно !=> load?
  # если элемент load, это значит, что нужно подгрузить всех доступных детей
  def load?
    false
  end

  def children_hash
    ActiveModelSerializers::SerializableResource.new(
      collection,
      each_serializer: element_serializer,
      **instance_options
    ).serializable_hash
  end

  def element_serializer
    NotImplementedError
  end

  def collection
    NotImplementedError
  end

  def included_in_options?(schema_name, var_name, _id = nil)
    _id = @object.id if _id.nil?

    instance_options.dig(schema_name, var_name).is_a?(Array) && (instance_options.dig(schema_name, var_name).map(&:to_i).include?(_id) || instance_options.dig(schema_name, var_name).include?(_id)) ||
      instance_options.dig(schema_name, var_name).is_a?(String) && (instance_options.dig(schema_name, var_name).to_i.eql?(_id) || instance_options.dig(schema_name, var_name).eql?(_id))
  end
end
