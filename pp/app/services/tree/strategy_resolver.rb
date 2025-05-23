# frozen_string_literal: true

class Tree::StrategyResolver < ::Nsud::Essentials::ApplicationService

  def initialize(params, &policy_scoper)
    @params = params
    @context = params[:context]&.to_sym
    @policy_scoper = policy_scoper
  end

  def call
    case context
    when :compare_podd
      Tree::ComparePodd::StrategyResolver.call(params, &policy_scoper)
    when :compare_podd_podm
      Tree::ComparePoddPodm::StrategyResolver.call(params, &policy_scoper)
    else
      resolve_node
    end
  end

  private

  attr_reader :params, :context, :policy_scoper

  def resolve_node
    policy_scoper.call(Organization)

    Tree::BaseService.empty_nodes
  end
end
