# frozen_string_literal: true

class Tree::Cached::StrategyResolver < Tree::StrategyResolver

  def initialize(params, &policy_scoper)
    super
    @context_key = params[:context_key]&.to_s
    @cacheable_id = params[:cacheable_id]&.to_i
    @cacheable_type = params[:cacheable_type]&.to_s || CachedTree.cacheable_class_name_for(context_key)
  end

  def call
    return resolve_empty_node unless valid_params?
    cached_tree_data
  end

  private

  attr_reader :context_key, :cacheable_id, :cacheable_type

  def valid_params?
    context_key.present? && cacheable_id.present? && cacheable_type.present?
  end

  def cached_tree_data
    @cached_tree_data ||=
      begin
        return resolve_unset_node if resource.blank?
        return resolve_empty_node if cached_tree.blank?
        cached_tree.data
      end
  end

  def resource
    @resource ||= CachedTree.for_cache(context_key, cacheable_type, cacheable_id).last
  end

  def cached_tree
    @cached_tree ||= policy_scope(cacheable_type.constantize.where(id: cacheable_id)).take ? resource : nil
  end

  def resolve_unset_node
    resolve_empty_policy

    text =
      case context_key
      when 'compare_podd'
        I18n.t('jstree.cached_compare_podd_unset_message')
      when 'compare_podd_podm'
        I18n.t('jstree.cached_compare_podd_podm_unset_message')
      else
        nil
      end

    Tree::BaseService.empty_nodes(text: text)
  end
end
