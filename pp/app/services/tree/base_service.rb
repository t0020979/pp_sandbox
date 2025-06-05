# frozen_string_literal: true
class Tree::BaseService < Tree::Base

  def initialize(params, &policy_scoper)
    super
    @parent_id = params[:parent_id]&.to_s
  end

  private

  attr_reader :parent_id

  def safe_params(*keys)
    params.slice(*keys).permit!.to_h
  end

  def build_collection(collection, **instance_options)
    ActiveModelSerializers::SerializableResource.new(
      collection,
      each_serializer: element_serializer,
      **instance_options
    ).serializable_hash
  end

  def build_node(element)
    element_serializer.new(element)
  end

  def element_serializer
    NotImplementedError
  end

  class << self
    def empty_nodes(text: nil, type: nil)
      [{ id: '0', text: text || I18n.t('jstree.no_one_element'), type: type || "attr_warning" }]
    end

    def placeholder_nodes
      [{ id: 'placeholder', text: 'Загрузка...', type: "placeholder" }]
    end
  end
end