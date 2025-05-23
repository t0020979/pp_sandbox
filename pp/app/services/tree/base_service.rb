# frozen_string_literal: true
class Tree::BaseService < ::Nsud::Essentials::ApplicationService

  def initialize(params, &policy_scoper)
    @params = params
    @policy_scoper = policy_scoper
    @parent_id = params[:parent_id]&.to_s
  end

  private

  attr_reader :params, :policy_scoper, :parent_id

  def policy_scope(scope)
    policy_scoper.call(scope)
  end

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
    def empty_nodes
      [{ id: '0', text: I18n.t('jstree.no_one_element'), type: "attr_warning" }]
    end

    def placeholder_nodes
      [{ id: 'placeholder', text: 'Загрузка...', type: "placeholder" }]
    end
  end
end